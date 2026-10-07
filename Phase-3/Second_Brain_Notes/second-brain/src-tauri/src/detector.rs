use regex::Regex;
use std::sync::OnceLock;

pub fn detect_content_type(text: &str) -> &str {
    let trimmed = text.trim();
    if trimmed.is_empty() { return "note"; }
    if is_url(trimmed) { return "link"; }
    if is_code(trimmed) { return "codeSnippet"; }
    "note"
}

fn is_url(text: &str) -> bool {
    if text.contains(char::is_whitespace) { return false; }
    if text.to_lowercase().starts_with("http://") || text.to_lowercase().starts_with("https://") || text.to_lowercase().starts_with("ftp://") || text.to_lowercase().starts_with("ftps://") { return true; }
    static WWW_RE: OnceLock<Regex> = OnceLock::new();
    let www_re = WWW_RE.get_or_init(|| Regex::new(r"(?i)^www\.[a-z0-9-]+\.[a-z]{2,}").unwrap());
    if www_re.is_match(text) { return true; }
    static BARE_RE: OnceLock<Regex> = OnceLock::new();
    let bare_re = BARE_RE.get_or_init(|| Regex::new(r"(?i)^[a-z0-9-]+\.[a-z]{2,}/.+").unwrap());
    bare_re.is_match(text)
}

fn is_code(text: &str) -> bool {
    let mut score = 0;
    let lines: Vec<&str> = text.split('\n').collect();
    let mut indented = 0;
    for l in &lines {
        if l.starts_with(' ') || l.starts_with('\t') {
            if !l.trim().is_empty() { indented += 1; }
        }
    }
    if indented >= 2 { score += 1; }
    
    static KW_RE: OnceLock<Regex> = OnceLock::new();
    let kw_re = KW_RE.get_or_init(|| Regex::new(r"\b(function|def|class|const|let|var|return|import|export|from|if|else|elif|for|while|switch|case|break|continue|try|catch|finally|throw|async|await|yield|extends|implements|interface|type|enum|struct|fn|pub|use|mod|self|super|where|match|loop|move|ref|dyn|trait|impl|macro|#include|#define|#pragma|using|namespace|public|private|protected|static|void|int|bool|float|double|string|char|null|nil|None|True|False|true|false|undefined|package|func|go|defer|select|chan|map|make|new|delete|print|println|console\.log|require|module\.exports)\b").unwrap());
    if kw_re.is_match(text) { score += 1; }

    static PUNCT_RE: OnceLock<Regex> = OnceLock::new();
    let punct_re = PUNCT_RE.get_or_init(|| Regex::new(r"(\{|\}|;|=>|->|===|!==|::|`|\|\||&&)").unwrap());
    if punct_re.is_match(text) { score += 1; }

    static FUNC_RE: OnceLock<Regex> = OnceLock::new();
    let func_re = FUNC_RE.get_or_init(|| Regex::new(r"\b\w+\s*\(").unwrap());
    if func_re.is_match(text) { score += 1; }

    static COMMENT_RE: OnceLock<Regex> = OnceLock::new();
    let comment_re = COMMENT_RE.get_or_init(|| Regex::new(r"(?m)^\s*(//|/\*|\*/|#\s|#$|--\s)").unwrap());
    if comment_re.is_match(text) { score += 1; }

    score >= 2
}
