export interface Movie {
    id: string;
    name: string;
    thumbnail: string;
    releaseDate: string;
    ticketPrice: number;
}

export interface CartItem {
    movie: Movie;
    quantity: number;
    total: number;
}