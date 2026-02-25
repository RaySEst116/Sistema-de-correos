import React from 'react';

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  contentType: string;
}

interface AttachmentsListProps {
  attachments: Attachment[];
  onRemove: (index: number) => void;
  currentLang?: 'es' | 'en';
}

const translations = {
  es: { remove: 'Eliminar' },
  en: { remove: 'Remove' },
};

const AttachmentsList: React.FC<AttachmentsListProps> = ({
  attachments,
  onRemove,
  currentLang = 'es',
}) => {
  if (attachments.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '10px',
        borderTop: '1px solid var(--border-color, #e5e7eb)',
        paddingTop: '5px',
        maxHeight: '80px',
        overflowY: 'auto',
      }}
    >
      {attachments.map((file, index) => (
        <div
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-hover, #f3f4f6)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            marginRight: '5px',
            border: '1px solid var(--border-color, #e5e7eb)',
            color: 'var(--text-main, #374151)',
            marginBottom: '2px',
          }}
        >
          <i className="fas fa-paperclip" style={{ marginRight: '4px' }}></i>
          {file.filename}
          <i
            className="fas fa-times"
            onClick={() => onRemove(index)}
            style={{
              marginLeft: '5px',
              cursor: 'pointer',
              color: '#ef4444',
            }}
            title={translations[currentLang].remove}
          ></i>
        </div>
      ))}
    </div>
  );
};

export default AttachmentsList;
