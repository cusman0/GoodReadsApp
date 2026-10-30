const fs = require('fs');
let content = fs.readFileSync('src/components/Icon.tsx', 'utf8');

// Normalize line endings to \n temporarily
content = content.replace(/\r\n/g, '\n');

// Add edit and trash to IconProps
content = content.replace(
  "  | 'bell';",
  "  | 'bell'\n  | 'edit'\n  | 'trash';"
);

// Add switch cases
content = content.replace(
  "switch (name) {",
  "switch (name) {\n    case 'edit':\n      return <EditIcon size={size} color={color ?? '#00635D'} />;\n    case 'trash':\n      return <TrashIcon size={size} color={color ?? '#C0392B'} />;"
);

// Add Icon components before styles
const iconComponents = `
const EditIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>✎</Text>
);

const TrashIcon = ({ size, color }: { size: number; color: string }) => (
  <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>🗑</Text>
);
`;

content = content.replace(
  "const styles = StyleSheet.create({});",
  iconComponents + "\nconst styles = StyleSheet.create({});"
);

// Write back with \r\n
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync('src/components/Icon.tsx', content, 'utf8');
console.log('Icon.tsx updated successfully');

