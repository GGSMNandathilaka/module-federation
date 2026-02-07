import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MovieListComponent, type Movie } from './movie-list/movie-list';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MovieListComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('movie-catelog');

  /** Mock for standalone development – logs when running movie-catelog alone (ng serve) */
  protected addToCart(movie: Movie): void {
    console.log('Add to cart (standalone mode):', movie.name);
  }
}
