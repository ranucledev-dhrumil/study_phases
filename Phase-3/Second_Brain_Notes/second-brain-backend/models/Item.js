import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    linkedNoteIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Item', default: [] },
    unresolvedLinks: { type: [String], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, discriminatorKey: 'type', collection: 'notes' });

const Item = mongoose.model('Item', itemSchema);

const Note = Item.discriminator('note', new mongoose.Schema({
    content: { type: String, required: true }
}));

const Snippet = Item.discriminator('snippet', new mongoose.Schema({
    code: { type: String, required: true },
    language: { type: String, default: 'javascript' }
}));

const Link = Item.discriminator('link', new mongoose.Schema({
    url: { type: String, required: true },
    description: { type: String }
}));

export { Item, Note, Snippet, Link };
