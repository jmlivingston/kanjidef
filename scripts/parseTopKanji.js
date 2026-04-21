import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.resolve(__dirname, 'kanjidic2-en-3.6.2.json');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'kanji.json');
const MAX_FREQUENCY = 2500;

function hasFrequencyAtOrBelowThreshold(character) {
	const frequency = character?.misc?.frequency;
	return typeof frequency === 'number' && frequency <= MAX_FREQUENCY;
}

function uniqueValues(values) {
	return [...new Set(values)];
}

function transformCharacter(character) {
	const groups = character?.readingMeaning?.groups ?? [];
	const readings = groups.flatMap((group) => group?.readings ?? []);
	const meanings = groups.flatMap((group) => group?.meanings ?? []);

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

	return {
		literal: character.literal,
		on: jaOn,
		kun: jaKun,
		meanings: rootMeanings,
	};
}

async function main() {
	const rawJson = await readFile(INPUT_PATH, 'utf8');
	const source = JSON.parse(rawJson);

	const filteredCharacters = (source.characters ?? [])
		.filter(hasFrequencyAtOrBelowThreshold)
		.map(transformCharacter);

	const output = {
		data: filteredCharacters,
	};

	await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
	await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

	console.log(
		`Wrote ${filteredCharacters.length} kanji with frequency <= ${MAX_FREQUENCY} to ${OUTPUT_PATH}`,
	);
}

main().catch((error) => {
	console.error('Failed to parse kanji JSON:', error);
	process.exitCode = 1;
});
