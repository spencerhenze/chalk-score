export interface Gymnast {
  id: string;
  firstName: string;
  lastName: string;
  level: string;
  levelSortOrder: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface CreateGymnastRequest {
  firstName: string;
  lastName: string;
  level: number;
}

export interface UpdateGymnastRequest {
  firstName: string;
  lastName: string;
  level: number;
  imageUrl: string | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}
