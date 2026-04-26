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
				label: 'Sign certificate for CSR',
				route: '/sign'
			},
			{
				label: 'Convert PEM/DER',
				route: '/convert'
			},
			{
				label: 'Decode a CSR or certificate',
				route: '/decode'
			},
			{
				label: 'Analyze PKCS#12',
				route: '/pkcs12-analyze'
			},
			{
				label: 'Build PKCS#12',
				route: '/pkcs12-build'
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
				label: 'Base64',
				route: '/base64'
			},
			{
				label: 'URL encoding',
				route: '/url-encoding'
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
