async function resolveFiles(data) {
	for (let item of data) {
		let file = localStorage.getItem(`font-${item.id}`);
		if (file) {
			item.file = file;
		} else {
			let r = await fetch(`https://raw.githubusercontent.com/chrissimpkins/codeface/master/fonts/${item.id}/vertical_metrics.txt`);
			let t = await r.text();
			let matches = t.match(/=== (.*?) ===/);
			if (!matches) { throw new Error(`Cannot resolve file name for ${item.id}`); }
			file = matches[1];
			item.file = file;
			localStorage.setItem(`font-${item.id}`, file);
		}
	}
}

function parse(text) {
	text = text.replace(/#.*/g, "");
	eval(text);
	return font_list.map(item => {
		let name = item[0];
		let id = item[1].filename;
		return { id, name, remote: true };
	});
}

function CMP(a, b) {
	return a.name.localeCompare(b.name);
}

function build(data, template) {
	let main = document.querySelector("main");
	main.innerHTML = "";
	data.forEach(item => {
		const id = item.id;
		let frag = template.content.cloneNode(true);

		let cb = frag.querySelector("input");
		cb.id = id;
		frag.querySelector("label").htmlFor = id;
		frag.querySelector("label").textContent = item.name;
		frag.querySelector("pre").style.fontFamily = id;

		let style = frag.querySelector("style");
		let url = (item.remote ? `https://raw.githack.com/chrissimpkins/codeface/master/fonts/${id}/${item.file}` : `fonts/${id}/${item.file}`);
		style.textContent = `@font-face {font-family: ${id}; src: url('${url}');}`;

		main.appendChild(frag);

		cb.addEventListener("click", () => {
			if (cb.checked) {
				delete localStorage[id];
			} else {
				localStorage[id] = 1;
			}
		});
		cb.checked = !(id in localStorage);
	});
}

async function go() {
	let data = [];

	try {
		let r = await fetch("https://raw.githubusercontent.com/chrissimpkins/codeface/master/scripts/utilities/fonts.py");
		let t = await r.text();
		data = parse(t);
		await resolveFiles(data);
	} catch (e) {
		alert(e.message);
		return;
	}

	data.push({
		id: "input",
		remote: false,
		name: "Input",
		file: "Input-Regular_(InputMono-Regular).ttf"
	});

	data.sort(CMP);

	let template = document.querySelector("template");
	build(data, template);
}

go();
