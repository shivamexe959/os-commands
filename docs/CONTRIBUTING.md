# Contributing

## Adding a New Algorithm

1. Add algorithm logic in `scripts/algorithms.js`
2. Add visualizer in `scripts/visualizers.js`
3. Add HTML panel in `index.html`
4. Add to `ALGORITHM_XP` in `scripts/constants.js`
5. Add a `showTool('your-algo-id')` call from the sidebar

## Adding a New Achievement

Edit `ACHIEVEMENTS` array in `scripts/features/achievements.js`:

```js
{ id:'my_achievement', icon:'🎯', name:'My Achievement', desc:'Description', xp:100 }
```

Then add its check function in the `checks` object.

## Code Style

- ES Modules only for new files
- No global variables
- Sanitize all user inputs with `sanitize()` from `helpers.js`
- Use `showToast(msg, type)` for user notifications
- Log errors with `console.error`, not `console.log`
