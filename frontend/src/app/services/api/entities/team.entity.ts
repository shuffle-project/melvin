export interface TeamEntity {
  id: string;
  name: string;
  sizeLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamListEntity {
  teams: TeamEntity[];
}
