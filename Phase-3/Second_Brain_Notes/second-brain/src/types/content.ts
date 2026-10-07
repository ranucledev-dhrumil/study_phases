/**
 * ContentType — shared content classification.
 *
 * Note, CodeSnippet, Link are the active v1 types.
 * Image and File are valid reserved members — nothing creates them in v1,
 * but they exist so the enum never needs a breaking change to add them.
 */
export type ContentType =
  | 'note'
  | 'codeSnippet'
  | 'link'
  | 'image'        // reserved — future image capture path
  | 'file';        // reserved — future file attachment capture

/** Typed constant bag — avoids bare string literals at call sites */
export const ContentTypes = {
  Note:        'note',
  CodeSnippet: 'codeSnippet',
  Link:        'link',
  Image:       'image',
  File:        'file',
} as const satisfies Record<string, ContentType>;
