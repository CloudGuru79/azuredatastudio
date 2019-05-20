/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vscode-nls';
import * as azdata from 'azdata';

import JupyterServerInstallation from '../jupyter/jupyterServerInstallation';

const localize = nls.loadMessageBundle();

export class ManagePackagesDialog {
	private dialog: azdata.window.Dialog;

	private readonly DialogTitle = localize('managePackages.dialogName', "Manage Packages");
	private readonly CancelButtonText = localize('managePackages.cancelButtonText', "Close");

	constructor(private jupyterInstallation: JupyterServerInstallation) {
	}

	/**
	 * Opens a dialog to configure python installation for notebooks.
	 * @param rejectOnCancel Specifies whether an error should be thrown after clicking Cancel.
	 * @returns A promise that is resolved when the python installation completes.
	 */
	public showDialog(): void {
		this.dialog = azdata.window.createModelViewDialog(this.DialogTitle);

		this.initializeContent();

		this.dialog.okButton.hidden = true;
		this.dialog.cancelButton.label = this.CancelButtonText;

		azdata.window.openDialog(this.dialog);
	}

	private initializeContent(): void {
		this.dialog.registerContent(async view => {

			let packageCountLabel = view.modelBuilder.text().withProperties({
				value: localize('managePackages.packageCountLabel', "{0} packages found in '{1}'", 0, this.jupyterInstallation.pythonBinPath)
			}).component();

			let packagesTable = view.modelBuilder.table()
				.withProperties({
					columns: [
						localize('managePackages.pkgNameColumn', "Name"),
						localize('managePackages.pkgInstallDataColumn', "Installed On"),
						localize('managePackages.pkgVersionColumn', "Version")
					],
					data: [
						['Test', '00/00/00', '0.0.0'],
						['Test', '00/00/00', '0.0.0']
					],
					height: '600px',
					width: '400px'
				}).component();

			let formModel = view.modelBuilder.formContainer()
				.withFormItems([{
					component: packageCountLabel,
					title: ''
				}, {
					component: packagesTable,
					title: ''
				}]).component();

			await view.initializeModel(formModel);
		});
	}

	/*
	private showErrorMessage(message: string): void {
		this.dialog.message = {
			text: message,
			level: azdata.window.MessageLevel.Error
		};
	}
	*/
}