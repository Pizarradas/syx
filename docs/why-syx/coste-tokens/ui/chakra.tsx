import { Button, Card, Dialog, Field, Input, Portal } from "@chakra-ui/react"

export default function DeleteProject() {
  return (
    <Card.Root maxW="md">
      <Card.Header>
        <Card.Title>Delete project</Card.Title>
        <Card.Description>This removes the project and all its files.</Card.Description>
      </Card.Header>
      <Card.Body>
        <form>
          <Field.Root invalid required>
            <Field.Label>Confirm with your email</Field.Label>
            <Input type="email" />
            <Field.ErrorText>Enter a valid email address.</Field.ErrorText>
          </Field.Root>
          <Dialog.Root role="alertdialog">
            <Dialog.Trigger asChild>
              <Button colorPalette="red" mt="4">
                Delete project
              </Button>
            </Dialog.Trigger>
            <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content>
                  <Dialog.Header>
                    <Dialog.Title>Delete project?</Dialog.Title>
                  </Dialog.Header>
                  <Dialog.Body>
                    <Dialog.Description>Files and history will be lost.</Dialog.Description>
                  </Dialog.Body>
                  <Dialog.Footer>
                    <Dialog.ActionTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </Dialog.ActionTrigger>
                    <Dialog.ActionTrigger asChild>
                      <Button colorPalette="red">Delete</Button>
                    </Dialog.ActionTrigger>
                  </Dialog.Footer>
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </form>
      </Card.Body>
    </Card.Root>
  )
}
