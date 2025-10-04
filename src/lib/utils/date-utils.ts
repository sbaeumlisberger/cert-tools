const millisecondsPerSecond = 1000;
const millisecondsPerMinute = 60 * millisecondsPerSecond;
const millisecondsPerHour = 60 * millisecondsPerMinute;
const millisecondsPerDay = 24 * millisecondsPerHour;

export function calculateDiff(dateA: Date, dateB: Date) {
	const totalMilliseconds = Math.abs(dateA.getTime() - dateB.getTime());
	let remaining = totalMilliseconds;
	const days = Math.floor(remaining / millisecondsPerDay);
	remaining -= days * millisecondsPerDay;
	const hours = Math.floor(remaining / millisecondsPerHour);
	remaining -= hours * millisecondsPerHour;
	const minutes = Math.floor(remaining / millisecondsPerMinute);
	remaining -= minutes * millisecondsPerMinute;
	const seconds = Math.floor(remaining / millisecondsPerSecond);
	remaining -= seconds * millisecondsPerSecond;
	const milliseconds = remaining;
	return {
		totalMilliseconds: totalMilliseconds,
		days: days,
		hours: hours,
		minutes: minutes,
		seconds: seconds,
		milliseconds: milliseconds
	};
}
