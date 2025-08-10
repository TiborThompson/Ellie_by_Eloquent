import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownRendererProps = {
  children: string;
};

export default function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Let prose handle most of the styling. We only need to customize code blocks.
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <div className="my-4 rounded-md bg-gray-900 border border-gray-700">
                <div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-b border-gray-700 rounded-t-md">
                  <span className="text-xs text-gray-400">{match[1]}</span>
                </div>
                <pre className="p-3 text-sm overflow-x-auto">
                  <code className={`language-${match[1]}`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-gray-700 text-purple-300 rounded-md px-1.5 py-0.5" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
} 