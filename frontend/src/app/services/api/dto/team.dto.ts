export interface CreateTeamDto {
  name: string;
  sizeLimit: number;
}

export interface UpdateTeamDto {
  name?: string;
  sizeLimit?: number;
}
