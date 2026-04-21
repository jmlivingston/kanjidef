import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.resolve(__dirname, 'kanjidic2-en-3.6.2.json');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'kanji.json');
const MAX_FREQUENCY = 5000;

function hasFrequencyAtOrBelowThreshold(character) {
	const frequency = character?.misc?.frequency;
	return typeof frequency === 'number' && frequency <= MAX_FREQUENCY;
}

function hasGradeAtOrBelowThreshold(character, maxGrade) {
	const grade = character?.misc?.grade;
	return typeof grade === 'number' && typeof maxGrade === 'number' && grade <= maxGrade;
}

function shouldIncludeCharacter(character, maxGrade) {
	return hasFrequencyAtOrBelowThreshold(character) || hasGradeAtOrBelowThreshold(character, maxGrade);
}

function uniqueValues(values) {
	return [...new Set(values)];
}

function getHighestNumericValue(characters, selector) {
	let highestValue = null;

	for (const character of characters) {
		const value = selector(character);
		if (typeof value !== 'number') {
			continue;
		}

		if (highestValue === null || value > highestValue) {
			highestValue = value;
		}
	}

	return highestValue;
}

function transformCharacter(character) {
	const groups = character?.readingMeaning?.groups ?? [];
	const readings = groups.flatMap((group) => group?.readings ?? []);
	const meanings = groups.flatMap((group) => group?.meanings ?? []);
	const nanori = character?.readingMeaning?.nanori ?? [];

	const jaOn = uniqueValues(
		readings
			.filter((reading) => reading?.type === 'ja_on' && typeof reading?.value === 'string')
			.map((reading) => reading.value),
	);

	const jaKun = uniqueValues(
		readings
			.filter((reading) => reading?.type === 'ja_kun' && typeof reading?.value === 'string')
			.map((reading) => reading.value),
	);

	const rootMeanings = uniqueValues(
		meanings
			.filter((meaning) => typeof meaning?.value === 'string')
			.map((meaning) => meaning.value),
	);

	const nanoriValues = uniqueValues(
		nanori.filter((value) => typeof value === 'string'),
	);

	return {
		literal: character.literal,
		on: jaOn,
		kun: jaKun,
		nanori: nanoriValues,
		meanings: rootMeanings,
	};
}

async function main() {
	const rawJson = await readFile(INPUT_PATH, 'utf8');
	const source = JSON.parse(rawJson);
	const sourceCharacters = source.characters ?? [];

	const highestFrequency = getHighestNumericValue(
		sourceCharacters,
		(character) => character?.misc?.frequency,
	);
	const highestGrade = getHighestNumericValue(
		sourceCharacters,
		(character) => character?.misc?.grade,
	);

	const filteredCharacters = sourceCharacters
		.filter((character) => shouldIncludeCharacter(character, highestGrade))
		.map(transformCharacter);

	const output = {
		meta: {
			count: filteredCharacters.length,
			highestFrequency,
			highestGrade,
		},
		data: filteredCharacters,
	};

	await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
	await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

	console.log(
		`Wrote ${filteredCharacters.length} kanji with frequency <= ${MAX_FREQUENCY} or grade <= ${highestGrade} to ${OUTPUT_PATH}`,
	);
}

main().catch((error) => {
	console.error('Failed to parse kanji JSON:', error);
	process.exitCode = 1;
});
