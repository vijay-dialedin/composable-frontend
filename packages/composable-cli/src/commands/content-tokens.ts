import chalk from "chalk"
import { OutputMessage, stringifyMessage } from "./output"
import { relativizePath } from "./path"
import terminalLink from "terminal-link"
// @ts-ignore
import cjs from "color-json"
import type { Change } from "diff"

export abstract class ContentToken<T> {
  value: T

  constructor(value: T) {
    this.value = value
  }

  abstract output(): string | string[]
}

export class RawContentToken extends ContentToken<string> {
  output(): string {
    return this.value
  }
}

export class LinkContentToken extends ContentToken<OutputMessage> {
  link: string

  constructor(value: OutputMessage, link: string) {
    super(value)
    this.link = link
  }

  output() {
    const text = chalk.green(stringifyMessage(this.value))
    const url = this.link ?? ""
    return terminalLink(text, url, { fallback: () => `${text} ( ${url} )` })
  }
}

export class CommandContentToken extends ContentToken<OutputMessage> {
  output(): string {
    return chalk.bold(chalk.yellow(stringifyMessage(this.value)))
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class JsonContentToken extends ContentToken<any> {
  output(): string {
    try {
      return cjs(stringifyMessage(this.value) ?? {})
      // eslint-disable-next-line no-catch-all/no-catch-all
    } catch (_) {
      return JSON.stringify(stringifyMessage(this.value) ?? {}, null, 2)
    }
  }
}

export class LinesDiffContentToken extends ContentToken<Change[]> {
  output(): string[] {
    return this.value
      .map((part) => {
        if (part.added) {
          return part.value
            .split(/\n/)
            .filter((line) => line !== "")
            .map((line) => {
              return chalk.green(`+ ${line}\n`)
            })
        } else if (part.removed) {
          return part.value
            .split(/\n/)
            .filter((line) => line !== "")
            .map((line) => {
              return chalk.magenta(`- ${line}\n`)
            })
        } else {
          return part.value
        }
      })
      .flat()
  }
}

export class ColorContentToken extends ContentToken<OutputMessage> {
  color: (text: string) => string

  constructor(value: OutputMessage, color: (text: string) => string) {
    super(value)
    this.color = color
  }

  output(): string {
    return this.color(stringifyMessage(this.value))
  }
}

export class ErrorContentToken extends ContentToken<OutputMessage> {
  output(): string {
    return chalk.bold.redBright(stringifyMessage(this.value))
  }
}

export class PathContentToken extends ContentToken<OutputMessage> {
  output(): string {
    return relativizePath(stringifyMessage(this.value))
  }
}

export class HeadingContentToken extends ContentToken<OutputMessage> {
  output(): string {
    return chalk.bold.underline(stringifyMessage(this.value))
  }
}

export class SubHeadingContentToken extends ContentToken<OutputMessage> {
  output(): string {
    return chalk.underline(stringifyMessage(this.value))
  }
}

export class ItalicContentToken extends ContentToken<OutputMessage> {
  output(): string {
    return chalk.italic(stringifyMessage(this.value))
  }
}
