/**
 * Utility functions for certificate validation and parsing
 */
/**
 * Formats a distinguished name (DN) string to be more readable
 * @param {string} dn - The distinguished name string
 * @returns {string} - Formatted DN string
 */
export const formatDN = (dn) => {
    if (!dn)
        return "";
    // Replace commas with commas followed by spaces for better readability
    return dn.replace(/,/g, ", ");
};
/**
 * Formats a date string to a human-readable format
 * @param {string} dateString - The date string
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
    if (!dateString)
        return "N/A";
    try {
        const date = new Date(dateString);
        return date.toLocaleString();
    }
    catch (error) {
        return dateString;
    }
};
/**
 * Checks if a certificate is currently valid based on its validity period
 * @param {Date | string} notBefore - The start date of validity
 * @param {Date | string} notAfter - The end date of validity
 * @returns {boolean} - Whether the certificate is currently valid
 */
export const isDateValid = (notBefore, notAfter) => {
    const now = new Date();
    return now >= new Date(notBefore) && now <= new Date(notAfter);
};
/**
 * Formats an array of values to a comma-separated string
 * @param {Array<string>} array - The array to format
 * @returns {string} - Comma-separated string
 */
export const formatArray = (array) => {
    if (!array || !Array.isArray(array))
        return "N/A";
    return array.join(", ");
};
