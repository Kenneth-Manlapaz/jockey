import { DEMO_USER, useSessionStore } from '@/lib/auth/session';

beforeEach(() => {
  useSessionStore.setState({ user: null, loading: false });
});

describe('session store', () => {
  it('starts signed out', () => {
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('signs in as the demo account without any credentials', () => {
    useSessionStore.getState().signInDemo();
    const user = useSessionStore.getState().user;
    expect(user?.id).toBe(DEMO_USER.id);
    expect(user?.firstName).toBe('Isabella');
  });

  it('signs up and stores the resulting account', async () => {
    await useSessionStore.getState().signUp({
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan@example.com',
      mobile: '+639171111111',
      password: 'Strong-pass-123',
    });

    const state = useSessionStore.getState();
    expect(state.user?.firstName).toBe('Juan');
    expect(state.user?.initials).toBe('JD');
    expect(state.loading).toBe(false);
  });

  it('recomputes initials when the name is updated', () => {
    useSessionStore.setState({ user: { ...DEMO_USER } });
    useSessionStore.getState().updateUser({ firstName: 'Anna', lastName: 'Reyes' });

    const user = useSessionStore.getState().user;
    expect(user?.firstName).toBe('Anna');
    expect(user?.initials).toBe('AR');
  });

  it('ignores updates while signed out', () => {
    useSessionStore.getState().updateUser({ firstName: 'Ghost' });
    expect(useSessionStore.getState().user).toBeNull();
  });

  it('clears the account on sign out', () => {
    useSessionStore.setState({ user: { ...DEMO_USER } });
    useSessionStore.getState().signOut();
    expect(useSessionStore.getState().user).toBeNull();
  });
});
