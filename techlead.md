# Tech Lead Guide: Building a Readable Codebase

As the tech lead for the Stallplass project, I'm establishing these guidelines to ensure our codebase remains clean, readable, and maintainable. Our goal is to write code that any developer can understand within minutes, not hours.

## Core Philosophy

**"Code is read 10x more than it's written"** - Optimize for the reader, not the writer.

## 1. TypeScript: Keep It Simple

### ✅ DO: Use Supabase Types as Foundation
```typescript
// Simple and clear
import { Database } from '@/types/supabase';
type Stable = Database['public']['Tables']['stables']['Row'];

// When you need relations
type StableWithBoxes = Stable & {
  boxes: Box[];
};
```

### ❌ DON'T: Create Redundant Interfaces
```typescript
// Avoid this
interface IStableEntity {
  id: string;
  name: string;
  // ... duplicating database schema
}
```

### Keep Types Obvious
- Name types clearly: `User`, `Stable`, `Box` (not `IUserDTO`, `StableInterface`)
- Use descriptive names: `StableWithOwner` not `EnhancedStable`
- Avoid generic names: `PaymentStatus` not `Status`

## 2. Supabase: Direct and Simple

### ✅ DO: Simple, Direct Queries
```typescript
// Clear intent, easy to understand
const { data: stables } = await supabase
  .from('stables')
  .select('*, boxes(*)')
  .eq('is_active', true);
```

### ❌ DON'T: Over-Abstract Database Access
```typescript
// Too much abstraction
class StableRepository extends BaseRepository<Stable> {
  async findActiveWithRelations(): Promise<EnrichedStableDTO[]> {
    // layers of abstraction...
  }
}
```

### Database Best Practices
- Use Supabase client directly - it's already an abstraction
- Keep queries where they're used (in components/hooks)
- Only create service functions for complex business logic
- Let TypeScript infer types from Supabase responses

## 3. React Components: Flat and Focused

### ✅ DO: Simple, Single-Purpose Components
```typescript
// Easy to understand at a glance
export function StableCard({ stable }: { stable: Stable }) {
  return (
    <div className="p-4 border rounded">
      <h3>{stable.name}</h3>
      <p>{stable.description}</p>
    </div>
  );
}
```

### ❌ DON'T: Over-Engineer Components
```typescript
// Too complex
const StableCard: FC<IStableCardProps> = memo(({ 
  data, 
  callbacks, 
  config 
}) => {
  // 200 lines of complex logic
});
```

### Component Guidelines
- One component = one clear purpose
- Props should be obvious from usage
- Avoid prop drilling - use hooks for shared state
- Keep components under 150 lines

## 4. File Organization: Predictable Structure

### Standard File Naming
```
src/
  components/
    StableCard.tsx       # Component files: PascalCase
    use-stable.ts        # Hooks: kebab-case with 'use' prefix
  services/
    stable-service.ts    # Services: kebab-case with purpose
  app/
    stables/
      page.tsx          # Pages: always page.tsx
```

### ✅ DO: Co-locate Related Code
```
components/
  StableCard.tsx        # Component
  StableCard.test.tsx   # Test next to component
  stable-card.css       # Styles if needed
```

## 5. Hooks: Simple Data Fetching

### ✅ DO: Straightforward Hooks
```typescript
// Clear, single purpose
export function useStable(id: string) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['stable', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('stables')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    },
  });

  return { stable: data, error, isLoading };
}
```

### Real-time Subscriptions: Keep It Simple
```typescript
// One table, clear purpose
export function useRealtimeStables() {
  const [stables, setStables] = useState<Stable[]>([]);
  
  useEffect(() => {
    // Initial fetch
    supabase.from('stables').select('*').then(({ data }) => {
      if (data) setStables(data);
    });

    // Subscribe to changes
    const subscription = supabase
      .channel('stables')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'stables' 
      }, payload => {
        // Handle changes simply
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return stables;
}
```

## 6. State Management: Local First

### State Hierarchy (in order of preference)
1. **Component state** - for UI state
2. **URL state** - for shareable state (filters, pagination)
3. **React Query** - for server state
4. **Zustand** - only for complex client state

### ✅ DO: Keep State Close
```typescript
// State where it's needed
function StableFilter() {
  const [filter, setFilter] = useState('');
  // Use it locally
}
```

### ❌ DON'T: Global State for Everything
```typescript
// Avoid unless truly global
const useGlobalStableFilterStore = create(() => ({
  // Don't do this for simple filters
}));
```

## 7. API Routes: Thin and Secure

### ✅ DO: Simple Route Handlers
```typescript
// app/api/stables/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Validate user
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Simple query
  const { data, error } = await supabase
    .from('stables')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
```

## 8. Error Handling: Explicit and User-Friendly

### ✅ DO: Handle Errors at the Right Level
```typescript
// In components
if (error) {
  return <div>Kunne ikke laste stall. Prøv igjen senere.</div>;
}

// In services
const { data, error } = await supabase.from('stables').select();
if (error) {
  console.error('Failed to fetch stables:', error);
  throw new Error('Kunne ikke hente staller');
}
```

## 9. Comments: Why, Not What

### ✅ DO: Explain Business Logic
```typescript
// Free tier users can only create 3 stables
if (userStables.length >= 3 && !user.isPremium) {
  return { error: 'Grensen nådd' };
}
```

### ❌ DON'T: State the Obvious
```typescript
// Get stables from database ❌
const stables = await getStables();
```

## 10. Testing: Test Behavior, Not Implementation

### ✅ DO: Test User Outcomes
```typescript
test('shows error when stable name is empty', async () => {
  render(<CreateStable />);
  fireEvent.click(screen.getByText('Opprett'));
  expect(await screen.findByText('Navn er påkrevd')).toBeInTheDocument();
});
```

## Quick Checklist for PR Reviews

Before submitting code, ask yourself:
- [ ] Can a new developer understand this in 5 minutes?
- [ ] Are the types coming from Supabase, not custom interfaces?
- [ ] Is the component/function doing ONE thing?
- [ ] Are errors handled with Norwegian user messages?
- [ ] Is the code where I'd expect to find it?
- [ ] Did I avoid premature abstraction?
- [ ] Are my variable/function names self-documenting?

## The Golden Rule

**When in doubt, choose boring**. Boring code is:
- Predictable
- Easy to debug
- Easy to onboard new developers
- Less likely to have bugs

Remember: We're building a product, not showcasing clever code. The best code is code that delivers value to our users while being maintainable by our team.

## Migration Path

For existing complex code:
1. **Don't refactor everything at once**
2. **When you touch a file, simplify it**
3. **New features follow these guidelines**
4. **Gradually migrate during regular work**

---

*"Simplicity is the ultimate sophistication"* - Leonardo da Vinci

Keep it simple. Your future self (and your teammates) will thank you.