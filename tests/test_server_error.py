import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

import server


class ServerErrorMessageTest(unittest.TestCase):
    def test_bind_error_message_includes_em_dash_and_reason(self):
        err = OSError("boom")
        with patch("server.create_server", side_effect=err):
            buffer = io.StringIO()
            with redirect_stdout(buffer):
                exit_code = server.main()

        output = buffer.getvalue()
        self.assertEqual(exit_code, 1)
        self.assertIn("Failed to bind to", output)
        self.assertIn(" — ", output)  # em dash separator
        self.assertIn("boom", output)


if __name__ == "__main__":
    unittest.main()
