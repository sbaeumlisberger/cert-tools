export const navigation = [
	{
		title: 'Certificate tools',
		items: [
			{
				label: 'Create CSR',
				route: '/csr'
			},
			{
				label: 'Create certificate',
				route: '/certificate'
			},
			{
				label: 'Sign certificate',
				route: '/sign'
			},
			{
				label: 'Analyze a CSR or certificate',
				route: '/analyze'
			},
			{
				label: 'View PKCS#12',
				route: '/pkcs12-viewer'
			},
			{
				label: 'Create PKCS#12',
				route: '/pkcs12-builder'
			},
			{
				label: 'Bulk-create certificates',
				route: '/certificate-bulk'
			}
		]
	},
	{
		title: 'Developer tools',
		items: [
			{
				label: 'Decode/Encode Base64',
				route: '/base64'
			},
			{
				label: 'Format JSON',
				route: '/json'
			},
			{
				label: 'Format XML',
				route: '/xml'
			},
			{
				label: 'Parse JWT',
				route: '/jwt'
			},
			{
				label: 'Parse timestamp',
				route: '/timestmap'
			},
			{
				label: 'Generate UUID',
				route: '/uuid'
			},
			{
				label: 'Convert SVG to PNG',
				route: '/svg'
			},
			{
				label: 'Convert image to ICO',
				route: '/ico'
			}
		]
	}
];
