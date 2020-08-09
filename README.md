# vscode-alex

[![Dependency Status](https://david-dm.org/tlahmann/vscode-alex.svg)](https://david-dm.org/tlahmann/vscode-alex)
[![devDependency Status](https://david-dm.org/tlahmann/vscode-alex/dev-status.svg)](https://david-dm.org/tlahmann/vscode-alex?type=dev)

A [Visual Studio Code](https://code.visualstudio.com/) extension to find unequal phrasing in your text with [alex](https://alexjs.com/):

> Catch insensitive, inconsiderate writing.

![screencast](media/screencast.gif)

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

| Parameter                      | Description                                                                           | Default |
| ------------------------------ | ------------------------------------------------------------------------------------- | ------- |
| `alexLinter.strategy`          | Run the linter on save (onSave), on type (onType) or on user initiation (user)        | onSave  |
| `alexLinter.noBinary`          | Check if pairs like 'he or she' or 'garbageman or garbagewoman' are considered errors | false   |
| `alexLinter.profanitySureness` | Set the level of profanity check. Possible values are 'likely', 'maybe' and 'unlikely'. If set to 'maybe' words like 'addict' and 'asshat' are considered profanity. If set to 'likely' the word 'addict is not marked with a warning. | maybe   |

## Future features

* Quick-Fix extension 
  * Implement a 'change all occurrences' and 'change in all files' feature
  * Implement an 'ignore this'/'ignore all' functionality
* Extend the filetypes to check

## License

Copyright (c) 2015 [Shinnosuke Watanabe](https://github.com/shinnn)

Copyright (c) 2020 [Tobias Lahmann](https://github.com/tlahmann)

Licensed under [the MIT License](./LICENSE).
