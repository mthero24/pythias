const slugify = (title, separator = "-") => {
	return title
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, separator)
		.replace(/[^\w\-]+/g, "")
		.replace(/\_/g, separator)
		.replace(/\-\-+/g, separator)
		.replace(/\-$/g, "");
};

export default slugify;
