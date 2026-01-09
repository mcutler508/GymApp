# 🕺 Retro Theme Design Guide

This guide explains how to implement the groovy 70s retro theme throughout the gym tracker app.

## Design Philosophy

The retro theme is inspired by 1970s design aesthetics featuring:
- **Bold, vibrant colors**: Orange (#FF6B35), Teal (#2A9D8F), Yellow (#FFB627)
- **Warm cream background**: Creates that vintage paper/poster feel (#F5E6D3)
- **Thick borders**: 3-4px borders for visual weight and presence
- **Super rounded corners**: 20-28px for that groovy curved look
- **Bold typography**: 600-800 font weights for impact
- **Colored shadows**: Orange and teal glows instead of standard black shadows
- **High contrast**: Deep purple text (#2D1B4E) on cream backgrounds

## Color Palette

```typescript
Primary: '#FF6B35'    // Vibrant retro orange
Secondary: '#2A9D8F'  // Retro teal
Warning: '#FFB627'    // Golden yellow
Error: '#E63946'      // Bold red
Success: '#06A77D'    // Teal-green
Background: '#F5E6D3' // Warm cream
Surface: '#EDD9C0'    // Darker cream
Text: '#2D1B4E'       // Deep purple
Border: '#FF6B35'     // Orange borders
```

## Using Retro Styles in Components

### Step 1: Import utilities

```typescript
import { useTheme } from '../context/ThemeProvider';
import {
  getRetroCardStyle,
  getRetroButtonStyle,
  getRetroTextStyle,
  getRetroContainerStyle,
  getRetroInputStyle
} from '../utils/retroStyles';
```

### Step 2: Check if retro mode is active

```typescript
export default function MyComponent() {
  const { theme, mode } = useTheme();
  const isRetro = mode === 'retro';

  // ... rest of component
}
```

### Step 3: Apply retro styles conditionally

#### Cards

```typescript
<Card
  style={[
    styles.card,
    { backgroundColor: theme.colors.card },
    getRetroCardStyle({ theme, isRetro, variant: 'default' })
  ]}
>
  <Card.Content>
    {/* content */}
  </Card.Content>
</Card>
```

**Card Variants:**
- `'default'`: 4px border, 24px radius
- `'chunky'`: 5px border, 28px radius (extra bold)
- `'subtle'`: 2px border, 20px radius (lighter touch)

#### Buttons

```typescript
<Button
  mode="contained"
  onPress={handlePress}
  style={[
    styles.button,
    getRetroButtonStyle({ theme, isRetro, variant: 'primary' })
  ]}
  labelStyle={isRetro ? { fontWeight: '700', fontSize: 15 } : {}}
>
  Click Me
</Button>
```

**Button Variants:**
- `'primary'`: Orange border
- `'secondary'`: Teal border
- `'danger'`: Dark red border

#### Text

```typescript
<Text
  variant="titleLarge"
  style={[
    styles.title,
    { color: theme.colors.text },
    getRetroTextStyle({ isRetro, variant: 'heading' })
  ]}
>
  Groovy Heading
</Text>
```

**Text Variants:**
- `'heading'`: 800 weight, 0.5 letter spacing
- `'title'`: 700 weight, 0.3 letter spacing
- `'label'`: 600 weight, 0.2 letter spacing
- `'body'`: 500 weight

#### Containers/Surfaces

```typescript
<View
  style={[
    styles.container,
    { backgroundColor: theme.colors.surface },
    getRetroContainerStyle({ theme, isRetro })
  ]}
>
  {/* content */}
</View>
```

#### Input Fields

```typescript
<TextInput
  style={[
    styles.input,
    getRetroInputStyle({ theme, isRetro })
  ]}
  // ... other props
/>
```

## Design Tokens

### Border Radius (Retro Theme)
- `sm`: 16px
- `md`: 20px
- `lg`: 24px
- `xl`: 28px

### Border Widths (Retro Theme)
- `thin`: 2px
- `medium`: 3px
- `thick`: 4px
- `chunky`: 5px

### Font Weights (Retro Theme)
- `regular`: 400
- `medium`: 600
- `semibold`: 700
- `bold`: 800
- `extrabold`: 900

### Shadows (Retro Theme)
All shadows use colored glows (orange/teal) instead of black:
- `level1`: Orange glow (15% opacity)
- `level2`: Orange glow (20% opacity)
- `level3`: Teal glow (25% opacity)
- `level4`: Teal glow (30% opacity)

## Examples

### Before (Standard Theme)
```typescript
<Card style={{ borderRadius: 12, elevation: 2 }}>
  <Text style={{ fontWeight: 'bold' }}>Title</Text>
</Card>
```

### After (Retro-Aware)
```typescript
<Card
  style={[
    { backgroundColor: theme.colors.card },
    getRetroCardStyle({ theme, isRetro })
  ]}
>
  <Text
    style={[
      { color: theme.colors.text },
      getRetroTextStyle({ isRetro, variant: 'title' })
    ]}
  >
    Title
  </Text>
</Card>
```

## Best Practices

1. **Always check `isRetro`**: Use `mode === 'retro'` to conditionally apply retro styles
2. **Use utility functions**: Don't hardcode retro values, use the utility functions for consistency
3. **Layer styles**: Apply base styles first, then theme colors, then retro styles
4. **Bold it up**: When in doubt, make it bolder! Retro is about presence
5. **Round those corners**: Use larger border radius values for that groovy feel
6. **Add borders**: Most elements should have visible borders in retro mode
7. **Test contrast**: Ensure text remains readable with bold colors and borders

## Color Combinations

### High Contrast (Recommended)
- Deep purple text (#2D1B4E) on cream background (#F5E6D3)
- White text on orange buttons (#FFFFFF on #FF6B35)
- White text on teal elements (#FFFFFF on #2A9D8F)

### Accent Colors
Use sparingly for variety:
- Orange: Primary actions
- Teal: Secondary actions
- Yellow: Warnings/highlights
- Red: Errors/danger

## Components Updated
- ✅ SettingsScreen
- ✅ ThemeToggle
- 🔲 HomeScreen (to be updated)
- 🔲 RoutinesScreen (to be updated)
- 🔲 ExercisesScreen (to be updated)
- 🔲 StatisticsScreen (to be updated)

## Need Help?

Check out `src/utils/retroStyles.ts` for all available utility functions and their options!

Keep it groovy! 🌈✨
