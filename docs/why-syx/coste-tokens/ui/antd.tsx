import React, { useState } from 'react';
import { Button, Card, Form, Input, Modal, Typography } from 'antd';

export default function DeleteProject() {
  const [open, setOpen] = useState(false);

  return (
    <Card title="Delete project" style={{ maxWidth: 448 }}>
      <Typography.Paragraph>This removes the project and all its files.</Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item
          label="Confirm with your email"
          name="email"
          required
          validateStatus="error"
          help="Enter a valid email address."
        >
          <Input type="email" />
        </Form.Item>
        <Button type="primary" danger onClick={() => setOpen(true)}>
          Delete project
        </Button>
      </Form>
      <Modal
        open={open}
        title="Delete project?"
        okText="Delete"
        okButtonProps={{ danger: true }}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      >
        <p>Files and history will be lost.</p>
      </Modal>
    </Card>
  );
}
