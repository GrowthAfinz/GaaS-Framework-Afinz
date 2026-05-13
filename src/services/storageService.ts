import { supabase } from './supabaseClient';

const BUCKET = 'app-data';

export interface StorageFile {
    name: string;
    id: string;
    created_at: string;
    updated_at: string;
    last_accessed_at: string;
    metadata: any;
}

export const storageService = {
    // List files in a specific folder (slot)
    async listFiles(folder: string) {
        const { data, error } = await supabase
            .storage
            .from(BUCKET)
            .list(folder, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) throw error;
        return data;
    },

    // Upload a file
    async uploadFile(folder: string, file: File) {
        // Create a unique name or use versioning. 
        // Strategy: "folder/filename-timestamp.ext"
        const timestamp = new Date().getTime();
        const extension = file.name.split('.').pop();
        const cleanName = file.name.replace(`.${extension}`, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();

        const path = `${folder}/${cleanName}-${timestamp}.${extension}`;

        const { data, error } = await supabase
            .storage
            .from(BUCKET)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;
        return data;
    },

    // Get public URL (if public) or Signed URL (if private)
    // We assume private bucket for security, so Signed URL.
    async getDownloadUrl(path: string) {
        const { data, error } = await supabase
            .storage
            .from(BUCKET)
            .createSignedUrl(path, 60 * 60); // 1 hour validity

        if (error) throw error;
        return data.signedUrl;
    },

    // Delete file
    async deleteFile(path: string) {
        const { error } = await supabase
            .storage
            .from(BUCKET)
            .remove([path]);

        if (error) throw error;
    }
};
