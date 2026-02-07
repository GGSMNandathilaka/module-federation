import {
  AfterViewInit,
  Component,
  computed,
  effect,
  signal,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';
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
export class App implements AfterViewInit {
  @ViewChild('movieCatalogHost', { read: ViewContainerRef })
  movieCatalogHost!: ViewContainerRef;

  @ViewChild('shoppingCartHost', { read: ViewContainerRef })
  shoppingCartHost!: ViewContainerRef;

  protected readonly title = signal('Movie Ticket Booking');
  protected readonly movieCatalogError = signal<string | null>(null);
  protected readonly shoppingCartError = signal<string | null>(null);

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

  private shoppingCartRef: { setInput: (name: string, value: unknown) => void; changeDetectorRef: { detectChanges: () => void } } | null = null;

  constructor() {
    effect(() => {
      const cart = this.cart();
      const ref = this.shoppingCartRef;
      if (ref) {
        ref.setInput('cart', cart);
        ref.setInput('subtotal', this.subtotal());
        ref.setInput('taxAmount', this.taxAmount());
        ref.setInput('totalCost', this.totalCost());
        ref.changeDetectorRef.detectChanges();
      }
    });
  }

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
        { movie, quantity: 1, total: movie.ticketPrice },
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

  async ngAfterViewInit(): Promise<void> {
    await this.loadMovieCatalog();
    await this.loadShoppingCart();
  }

  private async loadMovieCatalog(): Promise<void> {
    try {
      this.movieCatalogError.set(null);
      const m = await loadRemoteModule('movie-catelog', './MovieList');
      const MovieListComponent = m.MovieListComponent;
      if (this.movieCatalogHost && MovieListComponent) {
        this.movieCatalogHost.clear();
        const ref = this.movieCatalogHost.createComponent(MovieListComponent);
        ref.setInput('addToCart', this.addToCart.bind(this));
        ref.changeDetectorRef.detectChanges();
      }
    } catch (err) {
      console.error('Failed to load movie-catelog:', err);
      this.movieCatalogError.set('Movie catalog failed to load. Start the remote: cd movie-catelog && ng serve');
      this.movieCatalogHost?.clear();
    }
  }

  private async loadShoppingCart(): Promise<void> {
    try {
      this.shoppingCartError.set(null);
      const m = await loadRemoteModule('shopping-cart', './ShoppingCart');
      const ShoppingCartComponent = m.ShoppingCartComponent;
      if (this.shoppingCartHost && ShoppingCartComponent) {
        this.shoppingCartHost.clear();
        const ref = this.shoppingCartHost.createComponent(ShoppingCartComponent);
        this.shoppingCartRef = ref;
        ref.setInput('cart', this.cart());
        ref.setInput('subtotal', this.subtotal());
        ref.setInput('taxAmount', this.taxAmount());
        ref.setInput('totalCost', this.totalCost());
        ref.setInput('removeFromCart', this.removeFromCart.bind(this));
        ref.setInput('updateQuantity', this.updateQuantity.bind(this));
        ref.changeDetectorRef.detectChanges();
      }
    } catch (err) {
      console.error('Failed to load shopping-cart:', err);
      this.shoppingCartError.set('Shopping cart failed to load. Start the remote: cd shopping-cart && ng serve');
      this.shoppingCartHost?.clear();
    }
  }
}
