export class SignInDTO {
  email: string;
  password: string;
}

export class SignUpDTO extends SignInDTO {
  name: string;
}
