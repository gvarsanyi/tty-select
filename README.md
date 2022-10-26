# tty-select
Creates async an in-line selector from a simple string on the terminal.

## Install
```sh
npm install tty-select
```

## Use
```javascript
import { select } from 'tty-select';

select('Need you to say {*^yes} or {^no}').then((choice) => console.log('You said:', choice.text))
```
Renders on console as: "Need you to say <ins>**y**es</ins> or <ins>**n**o</ins>" (with "yes" highlighted)

## Symbols
- `{` and `}` mark the boundaries of a selectable text
- Within the selectable text: a starting `*` marks the pre-selected option
- Within the selectable text: `^` marks the following character as shortcut (case-insensitive)
All these symbols can be escaped by prefixing them with a `backslash`.

## Selection
- `right` or `tab`: moves selection to the right
- `end`: moves selection to the last selectable item
- `left` or `shift`+`tab`: moves selection to the left
- `home`: moves selection to the first selectable item
- `enter`: returns highlighted selection
- any shortcut: selects item, and returns it
