
export type FolderType = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'work' | 'personal' | 'quarantine';

export interface SecurityAnalysis {
    spf: 'pass' | 'fail' | 'softfail' | 'neutral';
    dkim: 'pass' | 'fail' | 'none';
    dmarc: 'pass' | 'fail' | 'none';
    ipReputation: 'clean' | 'blacklisted' | 'suspicious';
    confidenceScore: number; // 0 to 100 (100 is perfectly safe)
}

export interface Email {
    id: number;
    folder: FolderType;
    unread: boolean;
    sender: string;
    email: string;
    replyTo?: string; // New field for spoofing checks
    subject: string;
    preview: string;
    body: string;
    date: string;
    hasAttachments: boolean;
    attachmentName?: string;
    riskLevel?: 'safe' | 'suspicious' | 'high'; 
    riskReason?: string;
    securityAnalysis?: SecurityAnalysis; // New field for detailed forensics
}

export interface Contact {
    name: string;
    email: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role?: 'admin' | 'user'; 
}
