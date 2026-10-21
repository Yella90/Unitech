// components/public/ChatMarkdown.tsx
// Rendu des messages du chatbot (page /chat et widget flottant).
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toMarkdown } from '@/lib/chat/client';

export default function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const isMailto = href?.startsWith('mailto:');
            return (
              <a
                href={href}
                target={isMailto ? '_self' : '_blank'}
                rel={isMailto ? undefined : 'noopener noreferrer'}
                className="text-[#1E3A8A] underline hover:text-[#F97316] transition-colors font-medium break-all"
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="text-slate-700">{children}</li>,
          h1: ({ children }) => <h3 className="text-base font-bold text-[#1E3A8A] mt-3 mb-1">{children}</h3>,
          h2: ({ children }) => <h3 className="text-base font-semibold text-[#1E3A8A] mt-3 mb-1">{children}</h3>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-[#1E3A8A] mt-2 mb-1">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold text-[#1E3A8A]">{children}</strong>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#1E3A8A] pl-3 my-2 text-slate-600 italic">{children}</blockquote>
          ),
          code: ({ children }) => <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
        }}
      >
        {toMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
