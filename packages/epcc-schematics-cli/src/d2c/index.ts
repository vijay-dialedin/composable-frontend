/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  chain,
  empty,
  mergeWith,
  move,
  noop,
  schematic,
} from "@angular-devkit/schematics"
import {
  NodePackageInstallTask,
  NodePackageLinkTask,
  RepositoryInitializerTask,
} from "@angular-devkit/schematics/tasks"
import { SchematicOptionsSchema as ApplicationOptions } from "../application/schema"
import { SchematicOptionsSchema as WorkspaceOptions } from "../workspace/schema"
import { SchematicOptionsSchema as NgNewOptions } from "./schema"

export default function (options: NgNewOptions): Rule {
  if (!options.directory) {
    // If scoped project (i.e. "@foo/bar"), convert directory to "foo/bar".
    options.directory = options.name.startsWith("@")
      ? options.name.slice(1)
      : options.name
  }

  const workspaceOptions: WorkspaceOptions = {
    name: options.name,
    version: options.version,
    newProjectRoot: options.newProjectRoot,
    minimal: options.minimal,
    strict: options.strict,
    packageManager: options.packageManager,
  }
  const applicationOptions: ApplicationOptions = {
    projectRoot: "",
    name: options.name,
    inlineStyle: options.inlineStyle,
    inlineTemplate: options.inlineTemplate,
    prefix: options.prefix,
    viewEncapsulation: options.viewEncapsulation,
    routing: options.routing,
    style: options.style,
    skipTests: options.skipTests,
    skipPackageJson: false,
    // always 'skipInstall' here, so that we do it after the move
    skipInstall: true,
    strict: options.strict,
    minimal: options.minimal,
  }

  return chain([
    mergeWith(
      apply(empty(), [
        schematic("workspace", workspaceOptions),
        options.createApplication
          ? schematic("application", applicationOptions)
          : noop,
        move(options.directory),
      ])
    ),
    (_host: Tree, context: SchematicContext) => {
      let packageTask
      if (!options.skipInstall) {
        packageTask = context.addTask(
          new NodePackageInstallTask({
            workingDirectory: options.directory,
            packageManager: options.packageManager,
          })
        )
        if (options.linkCli) {
          packageTask = context.addTask(
            new NodePackageLinkTask("@angular/cli", options.directory),
            [packageTask]
          )
        }
      }
      if (!options.skipGit) {
        const commit =
          typeof options.commit == "object"
            ? options.commit
            : options.commit
            ? {}
            : false

        context.addTask(
          new RepositoryInitializerTask(options.directory, commit),
          packageTask ? [packageTask] : []
        )
      }
    },
  ])
}
