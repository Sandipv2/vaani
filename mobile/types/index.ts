export interface User {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    bannerImage?: string;
    bio?: string;
    location?: string;
    createdAt?: string;
    followers?: string[];
    following?: string[];
}

export interface Comment {
    _id: string;
    content: string;
    createdAt: string;
    user: User;
}

export interface PostMedia {
    url: string;
    type: "image" | "video";
    publicId?: string;
}

export interface Post {
    _id: string;
    content: string;
    image?: string;
    media?: PostMedia[];
    createdAt: string;
    user: User;
    likes: string[];
    comments: Comment[];
}

export interface Notification {
    _id: string;
    from: {
        username: string;
        firstName: string;
        lastName: string;
        profilePicture?: string;
    };
    to: string;
    type: "like" | "comment" | "follow";
    post?: {
        _id: string;
        content: string;
        image?: string;
        media?: PostMedia[];
    };
    comment?: {
        _id: string;
        content: string;
    };
    createdAt: string;
}
