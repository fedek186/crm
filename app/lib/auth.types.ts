export type AuthActionState = {
  error: string | null;
  success: boolean;
};

export const initialAuthActionState: AuthActionState = {
  error: null,
  success: false,
};
