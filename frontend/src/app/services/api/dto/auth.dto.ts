export interface AuthGuestLoginDto {
  inviteToken: string;
  name: string;
}

export interface ChangePasswordDto {
  email: string;
  oldPassword: string;
  newPassword: string;
}
