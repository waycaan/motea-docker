import { IncomingForm, File } from 'formidable';
import { ApiRequest } from './connect';

export function readFileFromRequest(req: ApiRequest): Promise<File> {
    return new Promise((resolve, reject): void => {
        const form = new IncomingForm();

        form.parse(req, (err, _fields, files) => {
            if (err) return reject(err);
            const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
            if (!uploadedFile) {
                return reject(new Error('No file found in request under field name "file"'));
            }
            resolve(uploadedFile);
        });
    });
}
