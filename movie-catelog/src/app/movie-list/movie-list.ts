import { Component, input } from '@angular/core';

export interface Movie {
  id: string;
  name: string;
  thumbnail: string;
  releaseDate: string;
  ticketPrice: number;
}

@Component({
  selector: 'app-movie-list',
  standalone: true,
  templateUrl: './movie-list.html',
})
export class MovieListComponent {
  addToCart = input.required<(movie: Movie) => void>();

  protected readonly movies: Movie[] = [
    { id: '1', name: 'Dune: Part Two', thumbnail: 'https://picsum.photos/seed/movie1/400/225', releaseDate: '2024-03-01', ticketPrice: 12.99 },
    { id: '2', name: 'Oppenheimer', thumbnail: 'https://picsum.photos/seed/movie2/400/225', releaseDate: '2023-07-21', ticketPrice: 14.99 },
    { id: '3', name: 'The Batman', thumbnail: 'https://picsum.photos/seed/movie3/400/225', releaseDate: '2022-03-04', ticketPrice: 11.99 },
    { id: '4', name: 'Spider-Man: No Way Home', thumbnail: 'https://picsum.photos/seed/movie4/400/225', releaseDate: '2021-12-17', ticketPrice: 13.99 },
    { id: '5', name: 'Top Gun: Maverick', thumbnail: 'https://picsum.photos/seed/movie5/400/225', releaseDate: '2022-05-27', ticketPrice: 12.49 },
  ];

  protected formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD' }).format(amount);
  }
}
