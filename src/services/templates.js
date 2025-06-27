const fs = require("fs");
const path = require("path");
const matter = require('gray-matter');

const logger = require("../logger");

class Templates {
    templatesFolder = path.join(__dirname, "../../templates/")
    imagesFolder = path.join(this.templatesFolder, "./images/")

    getTemplates() {
        try {
            let files = fs.readdirSync(this.templatesFolder)

            files = files.filter(file => file.endsWith(".md")).map((file) => path.join(this.templatesFolder, file))

            files = files.map(file => this.parseTemplate(fs.readFileSync(file, { encoding: "utf8" }))).filter(({ metadata: { active } }) => active)

            files = files.map(file => {
                if (file.metadata?.images && Array.isArray(file.metadata?.images)) {
                    file.metadata.images = file.metadata?.images
                        .map(image => path.join(this.imagesFolder, image))
                        .filter(image => fs.existsSync(image))
                }

                return file
            })

            return files
        } catch (error) {
            logger.error(error)
        }
    }

    parseTemplate(fileContent) {
        const { data, content } = matter(fileContent);

        return { metadata: data, content };
    }
}

module.exports = new Templates()