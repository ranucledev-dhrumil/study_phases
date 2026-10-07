import { Router } from 'express';
import { Item, Note, Snippet, Link } from '../models/Item.js';
import { z } from 'zod';
import validate from '../middleware/validate.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();

// Zod schemas for discriminators
const noteSchema = z.object({
  type: z.literal('note'),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()).optional(),
});

const snippetSchema = z.object({
  type: z.literal('snippet'),
  title: z.string().min(1, "Title is required"),
  code: z.string().min(1, "Code is required"),
  language: z.string().min(1, "Language is required"),
  tags: z.array(z.string()).optional(),
});

const linkSchema = z.object({
  type: z.literal('link'),
  title: z.string().optional(),
  url: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const putSchema = z.union([noteSchema, snippetSchema, linkSchema]);

async function resolveLinks(text, ownerId) {
    if (!text) return { linkedNoteIds: [], unresolvedLinks: [] };
    const matches = [...text.matchAll(/\[\[(.*?)\]\]/g)];
    const titles = [...new Set(matches.map(m => m[1]))]; // unique titles
    
    if (titles.length === 0) return { linkedNoteIds: [], unresolvedLinks: [] };
    
    const items = await Item.find({ 
        title: { $in: titles }, 
        owner: ownerId 
    });
    
    const foundTitles = items.map(item => item.title);
    const linkedNoteIds = items.map(item => item._id);
    const unresolvedLinks = titles.filter(t => !foundTitles.includes(t));
    
    return { linkedNoteIds, unresolvedLinks };
}

// GET /api/items/graph
router.get('/graph', authenticate, async (req, res, next) => {
    try {
        const items = await Item.find({ owner: req.user.userId }).select('_id title type linkedNoteIds');
        const nodes = items.map(i => ({ id: i._id.toString(), title: i.title, type: i.type }));
        const edges = [];
        items.forEach(source => {
            source.linkedNoteIds.forEach(targetId => {
                edges.push({ source: source._id.toString(), target: targetId.toString() });
            });
        });
        res.json({ nodes, edges });
    } catch (err) { next(err); }
});

// GET /api/items (returns all types)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const items = await Item.find({ owner: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user.userId
    }).lean();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    // Compute backlinks
    const backlinks = await Item.find({ linkedNoteIds: item._id, owner: req.user.userId }).select('_id title type');
    
    res.json({ ...item, backlinks });
  } catch (err) { next(err); }
});

// POST /api/items/notes
router.post('/notes', authenticate, validate(noteSchema), async (req, res, next) => {
  try {
    const { linkedNoteIds, unresolvedLinks } = await resolveLinks(req.body.content, req.user.userId);
    const note = await Note.create({
      ...req.body,
      linkedNoteIds,
      unresolvedLinks,
      owner: req.user.userId
    });
    res.status(201).json(note);
  } catch (err) { next(err); }
});

// POST /api/items/snippets
router.post('/snippets', authenticate, validate(snippetSchema), async (req, res, next) => {
  try {
    const { linkedNoteIds, unresolvedLinks } = await resolveLinks(req.body.code, req.user.userId);
    const snippet = await Snippet.create({
      ...req.body,
      linkedNoteIds,
      unresolvedLinks,
      owner: req.user.userId
    });
    res.status(201).json(snippet);
  } catch (err) { next(err); }
});

// POST /api/items/links
router.post('/links', authenticate, validate(linkSchema), async (req, res, next) => {
  try {
    let payload = { ...req.body, owner: req.user.userId };
    if (!payload.title) {
        try {
           const response = await fetch(payload.url);
           const html = await response.text();
           const match = html.match(/<title>(.*?)<\/title>/i);
           payload.title = (match && match[1]) ? match[1] : payload.url;
        } catch (e) {
           payload.title = payload.url;
        }
    }
    const { linkedNoteIds, unresolvedLinks } = await resolveLinks(payload.description, req.user.userId);
    payload.linkedNoteIds = linkedNoteIds;
    payload.unresolvedLinks = unresolvedLinks;
    const link = await Link.create(payload);
    res.status(201).json(link);
  } catch (err) { next(err); }
});

// PUT /api/items/:id
router.put('/:id', authenticate, validate(putSchema), async (req, res, next) => {
    try {
        let textToParse = "";
        if (req.body.type === 'note') textToParse = req.body.content;
        else if (req.body.type === 'snippet') textToParse = req.body.code;
        else if (req.body.type === 'link') textToParse = req.body.description;

        const { linkedNoteIds, unresolvedLinks } = await resolveLinks(textToParse, req.user.userId);

        const { type, ...updateFields } = req.body; // strip discriminator key out

        const updated = await Item.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.userId },
            { ...updateFields, linkedNoteIds, unresolvedLinks },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: 'Item not found' });
        res.json(updated);
    } catch (err) { next(err); }
});

// DELETE /api/items/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const item = await Item.findOneAndDelete({_id: req.params.id, owner: req.user.userId});
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { next(err); }
});

export default router;
