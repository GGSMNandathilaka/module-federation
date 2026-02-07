import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShoppingCartComponent, type CartItem } from './shopping-cart/shopping-cart';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShoppingCartComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('shopping-cart');

  /** Mock cart for standalone development – sample data when running shopping-cart alone */
  protected readonly cart = signal<CartItem[]>([
    {
      movie: {
        id: '1',
        name: 'Dune: Part Two',
        thumbnail: 'https://picsum.photos/seed/movie1/400/225',
        releaseDate: '2024-03-01',
        ticketPrice: 12.99,
      },
      quantity: 2,
      total: 25.98,
    },
    {
      movie: {
        id: '2',
        name: 'Oppenheimer',
        thumbnail: 'https://picsum.photos/seed/movie2/400/225',
        releaseDate: '2023-07-21',
        ticketPrice: 14.99,
      },
      quantity: 1,
      total: 14.99,
    },
  ]);

  protected readonly subtotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.total, 0);
  });

  protected readonly taxRate = 0.13;
  protected readonly taxAmount = computed(() => this.subtotal() * this.taxRate);
  protected readonly totalCost = computed(() => this.subtotal() + this.taxAmount());

  /** Mock for standalone development */
  protected removeFromCart(movieId: string): void {
    this.cart.set(this.cart().filter((item) => item.movie.id !== movieId));
  }

  /** Mock for standalone development */
  protected updateQuantity(movieId: string, delta: number): void {
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
}
