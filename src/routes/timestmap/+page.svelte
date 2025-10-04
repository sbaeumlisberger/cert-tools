<script lang="ts">
	import { calculateDiff } from '$lib/utils/date-utils';

	let timestamp = $state('');
	let parsed = $derived(parseTimestamp(timestamp));

	function parseTimestamp(timestamp: string): string {
		if (timestamp.trim().length === 0) {
			return '';
		}

		const num = Number(timestamp);
		if (isNaN(num)) {
			return 'Invalid timestamp';
		}

		const date =
			timestamp.trim().length === 10
				? new Date(num * 1000) // seconds to milliseconds
				: new Date(num); // already in milliseconds

		if (isNaN(date.getTime())) {
			return 'Invalid timestamp';
		}

		let result = date.toString() + '\n\nUTC: ' + date.toISOString();

		const now = new Date();
		if (date > now) {
			result += '\n\n in ' + formatDiff(date, now);
		} else {
			result += '\n\n' + formatDiff(date, now) + ' ago';
		}

		return result;
	}

	function formatDiff(dateA: Date, dateB: Date) {
		const diff = calculateDiff(dateA, dateB);
		let parts = [];
		if (diff.days > 0) {
			parts.push(diff.days + (diff.days > 1 ? ' days' : ' day'));
		}
		if (diff.hours > 0) {
			parts.push(diff.hours + (diff.hours > 1 ? ' hours' : ' hour'));
		}
		if (diff.minutes > 0) {
			parts.push(diff.minutes + (diff.minutes > 1 ? ' minutes' : ' minute'));
		}
		if (diff.seconds > 0) {
			parts.push(diff.seconds + (diff.seconds > 1 ? ' seconds' : ' second'));
		}
		if (diff.milliseconds > 0) {
			parts.push(diff.milliseconds + (diff.milliseconds > 1 ? ' milliseconds' : ' millisecond'));
		}
		return parts.join(' ');
	}
</script>

<svelte:head>
	<title>Certificate Tools - Parse timestamp</title>
</svelte:head>

<h2>Parse timestmap</h2>

<div style="display: flex; flex-direction: column; gap: 2rem; align-items: flex-start;">
	<input
		type="text"
		bind:value={timestamp}
		placeholder="Enter timestmap here"
		style="width: 100%; max-width: 400px;" />
	<span style="white-space: pre;">{parsed}</span>
</div>
