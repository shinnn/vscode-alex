# vscode-alex

[![Dependency Status](https://david-dm.org/tlahmann/vscode-alex.svg)](https://david-dm.org/tlahmann/vscode-alex)
[![devDependency Status](https://david-dm.org/tlahmann/vscode-alex/dev-status.svg)](https://david-dm.org/tlahmann/vscode-alex?type=dev)

A [Visual Studio Code](https://code.visualstudio.com/) extension to find unequal phrasing in your text with [alex](https://alexjs.com/):

> Catch insensitive, inconsiderate writing.

![screencast](media/screencast.png)

## Installation

* Run [`Install Extension`](https://code.visualstudio.com/docs/editor/extension-gallery#_install-an-extension) command from [Command Palette](https://code.visualstudio.com/Docs/editor/codebasics#_command-palette).
* Search and choose [`AlexJs Linter`](https://marketplace.visualstudio.com/items?itemName=TLahmann.alex-linter).

See the [extension installation guide](https://code.visualstudio.com/docs/editor/extension-gallery) for details.

## Usage

The extension should be enabled by default, you can verify this in the VS Code [settings](https://code.visualstudio.com/docs/getstarted/settings).

It automatically checks plain text, markdown, tex or other text based files.
The extension offers quick-fixes to easily replace words with suggestions from `alex`.

If you encounter any issues, feel free to open a ticket on [github](https://github.com/tlahmann/vscode-alex/issues).

### Extension Settings

| Parameter             | Description                                                                            | Default |
| --------------------- | -------------------------------------------------------------------------------------- | ------- |
| `alexLinter.enabled`  | Enable (true) or disable (false) AlexLinter                                            | true    |
| `alexLinter.strategy` | Run the linter on save (onSave) or on type (onType) or on user triggered action (user) | onSave  |

## Future features

* Enable further settings
  * Strategy: 'user' - only trigger on user initiation
* Quick-Fix extension 
  * implement a 'change all occurrences' and 'change in all files' feature
  * Include an 'ignore this'/'ignore all' functionality

## License

Copyright (c) 2015 [Shinnosuke Watanabe](https://github.com/shinnn)

Copyright (c) 2020 [Tobias Lahmann](https://github.com/tlahmann)

Licensed under [the MIT License](./LICENSE).
