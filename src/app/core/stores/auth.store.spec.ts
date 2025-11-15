import { TestBed } from '@angular/core/testing';
import { AuthStore, User } from './auth.store';
import { LocalStorageService } from '../services/local-storage.service';

describe('AuthStore', () => {
  let store: AuthStore;
  let storage: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthStore, LocalStorageService],
    });
    store = TestBed.inject(AuthStore);
    storage = TestBed.inject(LocalStorageService);
    storage.clearNamespace(); // isolate tests
  });

  it('should start unauthenticated', () => {
    expect(store.isAuthenticated()).toBeFalse();
  });

  it('should set and clear user', () => {
    const user: User = { id: '1', name: 'Test' };
    store.setUser(user);
    expect(store.isAuthenticated()).toBeTrue();
    expect(store.user()).toEqual(user);

    store.logout();
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.user()).toBeNull();
  });
});




