export declare class RegisterDto {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
