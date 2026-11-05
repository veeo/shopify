import { Children, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

const components: Components = {
  p: ({ children }) => <p className="[&:not(:first-child)]:mt-3">{children}</p>,
  ol: ({ children }) => <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 marker:text-[#8e8f8b]">{children}</ol>,
  ul: ({ children }) => <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 marker:text-[#8e8f8b]">{children}</ul>,
  li: ({ children }) => <li className="pl-0.5 [&>p]:mt-0">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[#b5a8ff] underline decoration-[#b5a8ff]/40 underline-offset-2 transition-colors hover:decoration-[#b5a8ff]"
    >
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-white/10 px-1 py-px font-mono text-[13px]">{children}</code>,
  h1: ({ children }) => <p className="mt-3 font-semibold">{children}</p>,
  h2: ({ children }) => <p className="mt-3 font-semibold">{children}</p>,
  h3: ({ children }) => <p className="mt-3 font-semibold">{children}</p>,
};

/** Splits plain-text children into word spans that fade in as they arrive. Keys are positional, so words already shown keep their element and don't replay the fade. */
function words(children: ReactNode) {
  return Children.map(children, (child) =>
    typeof child === "string"
      ? child.split(/(\s+)/).map((token, index) =>
          /^\s*$/.test(token) ? (
            token
          ) : (
            <span key={index} className="word-in">
              {token}
            </span>
          ),
        )
      : child,
  );
}

const streamingComponents: Components = Object.fromEntries(
  (["p", "li", "strong", "em", "a", "h1", "h2", "h3"] as const).map((tag) => {
    const Base = components[tag] as (props: Record<string, unknown>) => ReactNode;
    const Element = tag;
    return [
      tag,
      (props: { children?: ReactNode }) =>
        Base ? <Base {...props}>{words(props.children)}</Base> : <Element>{words(props.children)}</Element>,
    ];
  }),
);

/** While streaming, an unclosed `**` would show literally and then snap to bold; hold it back until it closes. */
function balance(text: string) {
  const marks = text.split("**").length - 1;
  if (marks % 2 === 0) return text;
  const at = text.lastIndexOf("**");
  return text.slice(0, at) + text.slice(at + 2);
}

export function Markdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return streaming ? (
    <ReactMarkdown components={{ ...components, ...streamingComponents }}>{balance(text)}</ReactMarkdown>
  ) : (
    <ReactMarkdown components={components}>{text}</ReactMarkdown>
  );
}
