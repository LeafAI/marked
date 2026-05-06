import TabBar from './TabBar'
import MonacoEditor from './MonacoEditor'
import styles from './EditorArea.module.css'

export default function EditorArea() {
  return (
    <div className={styles.editorArea}>
      <TabBar />
      <div className={styles.editorBody}>
        <MonacoEditor />
      </div>
    </div>
  )
}
