"use client";

import { useState } from "react";
import styles from "./FileSubMenu.module.css";

export default function FileSubmenu({ width }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter files by search term
  //   const filteredFiles = files.filter((file) =>
  //     file.name.toLowerCase().includes(searchTerm.toLowerCase()),
  //   );

  return (
    <div className={styles.submenu} style={{ width: `${width}px` }}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* <div className={styles.fileList}>
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <div key={file.id} className={styles.fileItem}>
              {file.name}
            </div>
          ))
        ) : (
          <div className={styles.emptyMessage}>No files found</div>
        )}
      </div> */}
    </div>
  );
}
