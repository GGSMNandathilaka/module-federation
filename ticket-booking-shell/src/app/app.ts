import { Component, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';

interface Movie {
  id: string;
  name: string;
  thumbnail: string;
  releaseDate: string;
  ticketPrice: number;
}

interface CartItem {
  movie: Movie;
  quantity: number;
  total: number;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Movie Ticket Booking');

  protected readonly movies = signal<Movie[]>([
    {
      id: '1',
      name: 'Dune: Part Two',
      thumbnail: 'https://picsum.photos/seed/movie1/400/225',
      releaseDate: '2024-03-01',
      ticketPrice: 12.99,
    },
    {
      id: '2',
      name: 'Oppenheimer',
      thumbnail: 'https://picsum.photos/seed/movie2/400/225',
      releaseDate: '2023-07-21',
      ticketPrice: 14.99,
    },
    {
      id: '3',
      name: 'The Batman',
      thumbnail: 'https://picsum.photos/seed/movie3/400/225',
      releaseDate: '2022-03-04',
      ticketPrice: 11.99,
    },
    {
      id: '4',
      name: 'Spider-Man: No Way Home',
      thumbnail: 'https://picsum.photos/seed/movie4/400/225',
      releaseDate: '2021-12-17',
      ticketPrice: 13.99,
    },
    {
      id: '5',
      name: 'Top Gun: Maverick',
      thumbnail: 'https://picsum.photos/seed/movie5/400/225',
      releaseDate: '2022-05-27',
      ticketPrice: 12.49,
    },
  ]);

  protected readonly cart = signal<CartItem[]>([]);

  protected readonly subtotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.total, 0);
  });

  protected readonly taxRate = 0.13;
  protected readonly taxAmount = computed(() => {
    return this.subtotal() * this.taxRate;
  });
  protected readonly totalCost = computed(() => {
    return this.subtotal() + this.taxAmount();
  });

  addToCart(movie: Movie): void {
    const currentCart = this.cart();
    const existing = currentCart.find((item) => item.movie.id === movie.id);

    if (existing) {
      this.cart.set(
        currentCart.map((item) =>
          item.movie.id === movie.id
            ? {
              ...item,
              quantity: item.quantity + 1,
              total: (item.quantity + 1) * movie.ticketPrice,
            }
            : item
        )
      );
    } else {
      this.cart.set([
        ...currentCart,
        {
          movie,
          quantity: 1,
          total: movie.ticketPrice,
        },
      ]);
    }
  }

  removeFromCart(movieId: string): void {
    this.cart.set(this.cart().filter((item) => item.movie.id !== movieId));
  }

  updateQuantity(movieId: string, delta: number): void {
    this.cart.set(
      this.cart()
        .map((item) => {
          if (item.movie.id !== movieId) return item;
          const newQty = Math.max(0, item.quantity + delta);
          if (newQty === 0) return null;
          return {
            ...item,
            quantity: newQty,
            total: newQty * item.movie.ticketPrice,
          };
        })
        .filter((item): item is CartItem => item !== null)
    );
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  }
}
