import mjml2html from 'mjml';
import set from 'lodash.set';

import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

export class Mjml implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MJML',
		name: 'mjml',
		icon: 'file:../../icons/mjml.svg',
		group: ['transform'],
		version: 1,
		usableAsTool: true,
		subtitle: '={{$parameter["name"]}}',
		description: 'Convert MJML to HTML',
		defaults: {
			name: 'MJML to HTML',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [],
		properties: [
			{
				displayName: 'Property Name',
				name: 'name',
				type: 'string',
				default: 'html',
				description:
					'Name of the property to write HTML to. Supports dot-notation. Example: "data.person[0].name"',
			},
			{
				displayName: 'MJML',
				name: 'mjml',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				description: 'MJML markup to convert to HTML',
			},
			// {
			// 	displayName: 'Beautify',
			// 	name: 'beautify',
			// 	type: 'boolean',
			// 	default: false,
			// 	description: 'Whether to beautify HTML output',
			// },
			// {
			// 	displayName: 'Minify',
			// 	name: 'minify',
			// 	type: 'boolean',
			// 	default: false,
			// 	description: 'Whether to minify HTML output',
			// },
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const propertyName = this.getNodeParameter('name', itemIndex, '') as string;
			const mjml = this.getNodeParameter('mjml', itemIndex, '') as string;
			// const beautify = this.getNodeParameter('beautify', itemIndex, false) as boolean;
			// const minify = this.getNodeParameter('minify', itemIndex, false) as boolean;

			item = items[itemIndex];

			const mjmlOptions = {
				// 	beautify,
				// 	minify,
			};

			const newItem: INodeExecutionData = {
				json: JSON.parse(JSON.stringify(item.json)),
				pairedItem: item.pairedItem,
			};

			if (item.binary !== undefined) {
				// Create a shallow copy of the binary data so that the old
				// data references which do not get changed still stay behind
				// but the incoming data does not get changed.
				newItem.binary = {};
				Object.assign(newItem.binary, item.binary);
			}

			try {
				set(newItem.json, propertyName, mjml2html(mjml, mjmlOptions).html);
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					returnData.push({ json: this.getInputData(itemIndex)[0].json, error });
					continue;
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
			returnData.push(newItem);
		}
		return this.prepareOutputData(returnData);
	}
}
