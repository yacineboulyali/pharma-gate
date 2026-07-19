import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './useAuth'

const mockAuth = {
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}

const singleMock = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockAuth.getSession(...args),
      onAuthStateChange: (...args) => mockAuth.onAuthStateChange(...args),
      signInWithPassword: (...args) => mockAuth.signInWithPassword(...args),
      signOut: (...args) => mockAuth.signOut(...args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => singleMock(),
        }),
      }),
    }),
  },
}))

function TestConsumer() {
  const { user, profile, loading, signIn, signOut } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.id || 'none'}</span>
      <span data-testid="profile">{profile?.username || 'none'}</span>
      <button onClick={() => signIn('Sara.Benali@pharmagest.local', 'secret').catch(() => {})}>login</button>
      <button onClick={() => signOut()}>logout</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
})

describe('AuthProvider / useAuth', () => {
  it("termine le chargement sans profil quand il n'y a pas de session", async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } })
    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(screen.getByTestId('profile')).toHaveTextContent('none')
  })

  it('charge le profil depuis la table users quand une session existe', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
    singleMock.mockResolvedValue({ data: { id: 'user-1', username: 'sara.benali', role: 'assistante' } })

    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('user')).toHaveTextContent('user-1')
    expect(screen.getByTestId('profile')).toHaveTextContent('sara.benali')
  })

  it("construit l'email fictif en minuscules et appelle signInWithPassword", async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } })
    mockAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByText('login'))

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'sara.benali@pharmagest.local',
      password: 'secret',
    })
  })

  it('propage une erreur de connexion', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } })
    mockAuth.signInWithPassword.mockResolvedValue({ data: null, error: new Error('Invalid credentials') })

    let caught = null
    function ThrowingConsumer() {
      const { signIn } = useAuth()
      return <button onClick={() => signIn('x', 'y').catch(e => { caught = e })}>login</button>
    }

    render(<AuthProvider><ThrowingConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('login'))

    await waitFor(() => expect(caught).not.toBeNull())
    expect(caught.message).toBe('Invalid credentials')
  })

  it('appelle signOut', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } })
    mockAuth.signOut.mockResolvedValue({ error: null })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByText('logout'))
    expect(mockAuth.signOut).toHaveBeenCalled()
  })
})
