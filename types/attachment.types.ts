export interface FileAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'png' | 'jpg' | 'mp4' | 'doc' | 'xlsx' | 'other';
  size: string;
  uploadedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  uploadedOn: string;
  attachedTo?: string;
  isProjectAttachment?: boolean;
  tags?: string[];
  shared?: boolean;
  presignedUrl?: string;
}
